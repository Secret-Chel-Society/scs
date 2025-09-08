"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useSupabase } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, AlertCircle, Shield, Users, Target, Database, Settings, RefreshCw, Key, Activity, Lock, User, Calendar, Trophy } from "lucide-react"

export function RbacDebugger() {
  const { supabase, session } = useSupabase()
  const { toast } = useToast()
  const [matchId, setMatchId] = useState("")
  const [userId, setUserId] = useState("")
  const [permissionResults, setPermissionResults] = useState<any>(null)
  const [userRoles, setUserRoles] = useState<any[]>([])
  const [teamManagers, setTeamManagers] = useState<any[]>([])
  const [allMatches, setAllMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session?.user) {
      setUserId(session.user.id)
      fetchUserData()
      fetchMatches()
    }
  }, [session])

  const fetchUserData = async () => {
    if (!session?.user) return

    try {
      // Fetch user roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", session.user.id)

      if (rolesError) throw rolesError
      setUserRoles(roles || [])

      // Fetch team managers
      const { data: managers, error: managersError } = await supabase
        .from("team_managers")
        .select("*, teams:team_id(name)")
        .eq("user_id", session.user.id)

      if (managersError) throw managersError
      setTeamManagers(managers || [])
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user data",
        variant: "destructive",
      })
    }
  }

  const fetchMatches = async () => {
    try {
      const { data: matches, error } = await supabase
        .from("matches")
        .select(
          `
          id,
          home_team:teams!home_team_id(id, name),
          away_team:teams!away_team_id(id, name),
          status,
          match_date
        `,
        )
        .order("match_date", { ascending: false })
        .limit(10)

      if (error) throw error
      setAllMatches(matches || [])
    } catch (error) {
      console.error("Error fetching matches:", error)
    }
  }

  const testPermissions = async () => {
    if (!matchId || !userId) {
      toast({
        title: "Error",
        description: "Please provide both Match ID and User ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Test the permission check API
      const response = await fetch("/api/matches/check-manager-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ matchId }),
      })

      const result = await response.json()
      setPermissionResults(result)

      toast({
        title: "Permission Check Complete",
        description: `Can manage match: ${result.canManageMatch ? "Yes" : "No"}`,
      })
    } catch (error) {
      console.error("Error testing permissions:", error)
      toast({
        title: "Error",
        description: "Failed to test permissions",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testMatchUpdate = async () => {
    if (!matchId) {
      toast({
        title: "Error",
        description: "Please provide a Match ID",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/matches/update-score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matchId,
          homeScore: 3,
          awayScore: 2,
          periodScores: [
            { home: 1, away: 0 },
            { home: 1, away: 1 },
            { home: 1, away: 1 },
          ],
          hasOvertime: false,
          hasShootout: false,
          status: "Completed",
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Success",
          description: "Match update test successful",
        })
      } else {
        toast({
          title: "Permission Denied",
          description: result.error || "Failed to update match",
          variant: "destructive",
        })
      }

      console.log("Match update result:", result)
    } catch (error) {
      console.error("Error testing match update:", error)
      toast({
        title: "Error",
        description: "Failed to test match update",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const normalizeRole = (role: string) => {
    if (!role) return "User"
    const normalized = role.toLowerCase().trim()
    const roleMap: { [key: string]: string } = {
      owner: "Owner",
      gm: "GM",
      agm: "AGM",
      "general manager": "General Manager",
      "assistant general manager": "Assistant General Manager",
      coach: "Coach",
      "assistant coach": "Assistant Coach",
      manager: "TeamManager",
      teammanager: "TeamManager",
    }
    return roleMap[normalized] || role
  }

  const hasManagerRole = (role: string) => {
    const managerRoles = ["Owner", "GM", "AGM", "General Manager", "Assistant General Manager", "TeamManager", "Coach"]
    return managerRoles.includes(normalizeRole(role))
  }

  return (
    <div className="space-y-6">
      <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
            <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            RBAC Permission Debugger
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="test" className="w-full">
            <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-r from-ice-blue-100/50 to-rink-blue-100/50 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 p-1 rounded-lg mb-6">
              <TabsList className="grid w-full grid-cols-3 bg-transparent">
                <TabsTrigger 
                  value="test" 
                  className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-ice-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:scale-105 transition-all duration-300"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Test Permissions
                </TabsTrigger>
                <TabsTrigger 
                  value="user" 
                  className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-assist-green-500 data-[state=active]:to-assist-green-600 data-[state=active]:text-white hover:scale-105 transition-all duration-300"
                >
                  <Users className="h-4 w-4 mr-2" />
                  User Info
                </TabsTrigger>
                <TabsTrigger 
                  value="matches" 
                  className="hockey-button data-[state=active]:bg-gradient-to-r data-[state=active]:from-rink-blue-500 data-[state=active]:to-rink-blue-600 data-[state=active]:text-white hover:scale-105 transition-all duration-300"
                >
                  <Trophy className="h-4 w-4 mr-2" />
                  Recent Matches
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="test" className="space-y-6">
              <Card className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-900 dark:to-ice-blue-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Target className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                    Test Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="userId" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                        <User className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                        User ID
                      </Label>
                      <Input
                        id="userId"
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="Enter user ID"
                        className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="matchId" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                        Match ID
                      </Label>
                      <Input
                        id="matchId"
                        value={matchId}
                        onChange={(e) => setMatchId(e.target.value)}
                        placeholder="Enter match ID"
                        className="hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 focus:ring-ice-blue-500/20 focus:border-ice-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button 
                      onClick={testPermissions} 
                      disabled={loading}
                      className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Test Permission Check
                        </>
                      )}
                    </Button>
                    <Button 
                      onClick={testMatchUpdate} 
                      disabled={loading}
                      variant="outline"
                      className="hockey-button border-ice-blue-200/50 dark:border-rink-blue-700/50 text-ice-blue-600 dark:text-ice-blue-400 hover:bg-ice-blue-50 dark:hover:bg-ice-blue-900/20 hover:scale-105 transition-all duration-300"
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Test Match Update
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {permissionResults && (
                <Card className={`hockey-card ${permissionResults.canManageMatch 
                  ? "border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20" 
                  : "border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20"
                }`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                      <Database className="h-5 w-5 text-ice-blue-600 dark:text-ice-blue-400" />
                      Permission Results
                      {permissionResults.canManageMatch ? (
                        <CheckCircle className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                      ) : (
                        <XCircle className="h-5 w-5 text-goal-red-600 dark:text-goal-red-400" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <Badge 
                        variant={permissionResults.canManageMatch ? "default" : "destructive"}
                        className={`${permissionResults.canManageMatch 
                          ? "bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white" 
                          : "bg-gradient-to-r from-goal-red-500 to-goal-red-600 text-white"
                        }`}
                      >
                        Can Manage: {permissionResults.canManageMatch ? "Yes" : "No"}
                      </Badge>
                      <Badge 
                        variant={permissionResults.isAdmin ? "default" : "secondary"}
                        className={`${permissionResults.isAdmin 
                          ? "bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 text-white" 
                          : "bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white"
                        }`}
                      >
                        Admin: {permissionResults.isAdmin ? "Yes" : "No"}
                      </Badge>
                      <Badge 
                        variant={permissionResults.isTeamManager ? "default" : "secondary"}
                        className={`${permissionResults.isTeamManager 
                          ? "bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 text-white" 
                          : "bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white"
                        }`}
                      >
                        Team Manager: {permissionResults.isTeamManager ? "Yes" : "No"}
                      </Badge>
                    </div>

                    {permissionResults.userTeams && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                          <Users className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                          User Teams for this Match:
                        </h4>
                        <div className="hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-900 dark:to-ice-blue-900/10 p-3 rounded-lg">
                          <pre className="text-xs font-mono text-hockey-silver-700 dark:text-hockey-silver-300 overflow-x-auto">
                            {JSON.stringify(permissionResults.userTeams, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {permissionResults.debug && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                          <Settings className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                          Debug Info:
                        </h4>
                        <Textarea
                          value={JSON.stringify(permissionResults.debug, null, 2)}
                          readOnly
                          className="h-40 text-xs font-mono hockey-search border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-900 dark:to-ice-blue-900/10"
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="user" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/30 dark:from-hockey-silver-900 dark:to-assist-green-900/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                      <Users className="h-5 w-5 text-assist-green-600 dark:text-assist-green-400" />
                      User Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userRoles.length > 0 ? (
                      <div className="space-y-3">
                        {userRoles.map((role, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-900 dark:to-ice-blue-900/10 rounded-lg">
                            <Badge className="bg-gradient-to-r from-assist-green-500 to-assist-green-600 text-white">
                              {role.role}
                            </Badge>
                            <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400">({normalizeRole(role.role)})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert className="border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                        <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                        <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">No user roles found</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/30 dark:from-hockey-silver-900 dark:to-rink-blue-900/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                      <Target className="h-5 w-5 text-rink-blue-600 dark:text-rink-blue-400" />
                      Team Manager Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamManagers.length > 0 ? (
                      <div className="space-y-3">
                        {teamManagers.map((manager, index) => (
                          <div key={index} className="space-y-2 p-3 hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-900 dark:to-ice-blue-900/10 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={hasManagerRole(manager.role) ? "default" : "secondary"}
                                className={`${hasManagerRole(manager.role) 
                                  ? "bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 text-white" 
                                  : "bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 text-white"
                                }`}
                              >
                                {manager.role}
                              </Badge>
                              <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{manager.teams?.name}</span>
                            </div>
                            <div className="text-xs text-hockey-silver-600 dark:text-hockey-silver-400 space-y-1">
                              <div>Team ID: <span className="font-mono">{manager.team_id}</span></div>
                              <div>Normalized: <span className="font-mono">{normalizeRole(manager.role)}</span></div>
                              <div>Has Manager Role: <span className={`font-semibold ${hasManagerRole(manager.role) ? "text-assist-green-600 dark:text-assist-green-400" : "text-goal-red-600 dark:text-goal-red-400"}`}>
                                {hasManagerRole(manager.role) ? "Yes" : "No"}
                              </span></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert className="border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                        <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                        <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">No team manager roles found</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="matches" className="space-y-6">
              <Card className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/30 dark:from-hockey-silver-900 dark:to-hockey-silver-900/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-hockey-silver-800 dark:text-hockey-silver-200">
                    <Trophy className="h-5 w-5 text-hockey-silver-600 dark:text-hockey-silver-400" />
                    Recent Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {allMatches.length > 0 ? (
                    <div className="space-y-3">
                      {allMatches.map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-4 hockey-card border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/30 dark:from-hockey-silver-900 dark:to-ice-blue-900/10 rounded-lg cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-300"
                          onClick={() => setMatchId(match.id)}
                        >
                          <div className="flex-1">
                            <div className="font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
                              <Trophy className="h-4 w-4 text-ice-blue-600 dark:text-ice-blue-400" />
                              {match.home_team?.name} vs {match.away_team?.name}
                            </div>
                            <div className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 flex items-center gap-2 mt-1">
                              <Calendar className="h-3 w-3" />
                              {match.match_date ? new Date(match.match_date).toLocaleDateString() : "Date TBD"} |{" "}
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${
                                  match.status === 'Completed' 
                                    ? 'border-assist-green-200 text-assist-green-700 bg-assist-green-50 dark:border-assist-green-700 dark:text-assist-green-400 dark:bg-assist-green-900/20'
                                    : match.status === 'Scheduled'
                                    ? 'border-ice-blue-200 text-ice-blue-700 bg-ice-blue-50 dark:border-ice-blue-700 dark:text-ice-blue-400 dark:bg-ice-blue-900/20'
                                    : 'border-hockey-silver-200 text-hockey-silver-700 bg-hockey-silver-50 dark:border-hockey-silver-700 dark:text-hockey-silver-400 dark:bg-hockey-silver-900/20'
                                }`}
                              >
                                {match.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-xs text-hockey-silver-500 dark:text-hockey-silver-500 font-mono bg-gradient-to-r from-ice-blue-100 to-rink-blue-100 dark:from-ice-blue-900/20 dark:to-rink-blue-900/20 px-2 py-1 rounded">
                            {match.id}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert className="border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20">
                      <AlertCircle className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
                      <AlertDescription className="text-hockey-silver-600 dark:text-hockey-silver-400">No matches found</AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

