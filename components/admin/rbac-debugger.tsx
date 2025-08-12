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
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

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
      <Card>
        <CardHeader>
          <CardTitle>RBAC Permission Debugger</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="test">Test Permissions</TabsTrigger>
              <TabsTrigger value="user">User Info</TabsTrigger>
              <TabsTrigger value="matches">Recent Matches</TabsTrigger>
            </TabsList>

            <TabsContent value="test" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="userId">User ID</Label>
                  <Input
                    id="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="Enter user ID"
                  />
                </div>
                <div>
                  <Label htmlFor="matchId">Match ID</Label>
                  <Input
                    id="matchId"
                    value={matchId}
                    onChange={(e) => setMatchId(e.target.value)}
                    placeholder="Enter match ID"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={testPermissions} disabled={loading}>
                  Test Permission Check
                </Button>
                <Button onClick={testMatchUpdate} disabled={loading} variant="outline">
                  Test Match Update
                </Button>
              </div>

              {permissionResults && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Permission Results
                      {permissionResults.canManageMatch ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={permissionResults.canManageMatch ? "default" : "destructive"}>
                          Can Manage: {permissionResults.canManageMatch ? "Yes" : "No"}
                        </Badge>
                        <Badge variant={permissionResults.isAdmin ? "default" : "secondary"}>
                          Admin: {permissionResults.isAdmin ? "Yes" : "No"}
                        </Badge>
                        <Badge variant={permissionResults.isTeamManager ? "default" : "secondary"}>
                          Team Manager: {permissionResults.isTeamManager ? "Yes" : "No"}
                        </Badge>
                      </div>

                      {permissionResults.userTeams && (
                        <div>
                          <h4 className="font-semibold">User Teams for this Match:</h4>
                          <pre className="text-xs bg-gray-100 p-2 rounded">
                            {JSON.stringify(permissionResults.userTeams, null, 2)}
                          </pre>
                        </div>
                      )}

                      {permissionResults.debug && (
                        <div>
                          <h4 className="font-semibold">Debug Info:</h4>
                          <Textarea
                            value={JSON.stringify(permissionResults.debug, null, 2)}
                            readOnly
                            className="h-40 text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="user" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>User Roles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userRoles.length > 0 ? (
                      <div className="space-y-2">
                        {userRoles.map((role, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Badge>{role.role}</Badge>
                            <span className="text-sm text-gray-500">({normalizeRole(role.role)})</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>No user roles found</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Team Manager Roles</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {teamManagers.length > 0 ? (
                      <div className="space-y-2">
                        {teamManagers.map((manager, index) => (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant={hasManagerRole(manager.role) ? "default" : "secondary"}>
                                {manager.role}
                              </Badge>
                              <span className="text-sm">{manager.teams?.name}</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Team ID: {manager.team_id} | Normalized: {normalizeRole(manager.role)} | Has Manager Role:{" "}
                              {hasManagerRole(manager.role) ? "Yes" : "No"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>No team manager roles found</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="matches" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Matches</CardTitle>
                </CardHeader>
                <CardContent>
                  {allMatches.length > 0 ? (
                    <div className="space-y-2">
                      {allMatches.map((match) => (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                          onClick={() => setMatchId(match.id)}
                        >
                          <div>
                            <div className="font-medium">
                              {match.home_team?.name} vs {match.away_team?.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {match.match_date ? new Date(match.match_date).toLocaleDateString() : "Date TBD"} |{" "}
                              {match.status}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">{match.id}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>No matches found</AlertDescription>
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
