"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, CheckCircle, Bug, Shield, Database, Users, Settings, Globe, Activity, Zap, Target, Crown, Hash } from "lucide-react"

export default function DiscordDebugPanel() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testing, setTesting] = useState(false)
  const [debugData, setDebugData] = useState<any>(null)
  const [testUserId, setTestUserId] = useState("")

  const runDebug = async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/discord/debug-sync")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Debug failed")
      }

      setDebugData(data)
      toast({
        title: "Debug completed",
        description: "Discord bot debug information retrieved successfully.",
      })
    } catch (error: any) {
      console.error("Debug error:", error)
      toast({
        title: "Debug failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const testRoleAssignment = async () => {
    if (!testUserId) {
      toast({
        title: "User ID required",
        description: "Please enter a Discord user ID to test role assignment.",
        variant: "destructive",
      })
      return
    }

    try {
      setTesting(true)

      const response = await fetch("/api/discord/test-role-assignment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ discordUserId: testUserId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Role assignment test failed")
      }

      toast({
        title: "Role assignment successful",
        description: "Test role assignment completed successfully.",
      })
    } catch (error: any) {
      console.error("Role assignment test error:", error)
      toast({
        title: "Role assignment failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Debug Information Card */}
      <Card className="hockey-card hockey-card-hover border-ice-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-ice-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b-2 border-ice-blue-200/50 dark:border-rink-blue-700/50 pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
            <div className="p-2 bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 rounded-lg">
              <Bug className="h-6 w-6 text-white" />
            </div>
            Debug Information
          </CardTitle>
          <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Check bot permissions and configuration status.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <Button 
            onClick={runDebug} 
            disabled={loading}
            className="hockey-button bg-gradient-to-r from-ice-blue-500 to-rink-blue-600 hover:from-ice-blue-600 hover:to-rink-blue-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
          >
            {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />}
            Run Debug Check
          </Button>

          {debugData && (
            <div className="space-y-6 mt-6">
              {/* Guild and Bot Information Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
                  <CardHeader className="border-b border-assist-green-200/50 dark:border-assist-green-700/50 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                      <div className="p-1.5 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded">
                        <Globe className="h-4 w-4 text-white" />
                      </div>
                      Guild Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                      <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Name</span>
                      <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-mono">{debugData.guild?.name}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                      <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">ID</span>
                      <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-mono">{debugData.guild?.id}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30">
                      <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Members</span>
                      <Badge variant="outline" className="bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700">
                        {debugData.guild?.member_count}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="hockey-card border-rink-blue-200/50 dark:border-rink-blue-700/50 bg-gradient-to-br from-white to-rink-blue-50/50 dark:from-hockey-silver-900 dark:to-rink-blue-900/20">
                  <CardHeader className="border-b border-rink-blue-200/50 dark:border-rink-blue-700/50 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                      <div className="p-1.5 bg-gradient-to-r from-rink-blue-500 to-rink-blue-600 rounded">
                        <Settings className="h-4 w-4 text-white" />
                      </div>
                      Bot Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-rink-blue-100/30 to-rink-blue-100/30 dark:from-rink-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-rink-blue-200/30 dark:border-rink-blue-700/30">
                      <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Username</span>
                      <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-mono">{debugData.bot?.username}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-rink-blue-100/30 to-rink-blue-100/30 dark:from-rink-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-rink-blue-200/30 dark:border-rink-blue-700/30">
                      <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">ID</span>
                      <span className="text-sm text-hockey-silver-600 dark:text-hockey-silver-400 font-mono">{debugData.bot?.id}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-rink-blue-100/30 to-rink-blue-100/30 dark:from-rink-blue-900/10 dark:to-rink-blue-900/10 rounded-lg border border-rink-blue-200/30 dark:border-rink-blue-700/30">
                      <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">Roles</span>
                      <Badge variant="outline" className="bg-gradient-to-r from-rink-blue-100 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-900/20 text-rink-blue-700 dark:text-rink-blue-300 border-rink-blue-200 dark:border-rink-blue-700">
                        {debugData.bot?.roles?.length || 0}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Configuration Status */}
              <Card className="hockey-card border-hockey-silver-200/50 dark:border-hockey-silver-700/50 bg-gradient-to-br from-white to-hockey-silver-50/50 dark:from-hockey-silver-900 dark:to-hockey-silver-900/20">
                <CardHeader className="border-b border-hockey-silver-200/50 dark:border-hockey-silver-700/50 pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                    <div className="p-1.5 bg-gradient-to-r from-hockey-silver-500 to-hockey-silver-600 rounded">
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    Configuration Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-3">
                    <Badge 
                      variant={debugData.config?.registered_role_exists ? "default" : "destructive"}
                      className={`${debugData.config?.registered_role_exists 
                        ? "bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700" 
                        : "bg-gradient-to-r from-goal-red-100 to-goal-red-100 dark:from-goal-red-900/20 dark:to-goal-red-900/20 text-goal-red-700 dark:text-goal-red-300 border-goal-red-200 dark:border-goal-red-700"
                      }`}
                    >
                      {debugData.config?.registered_role_exists ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <AlertTriangle className="mr-1 h-3 w-3" />
                      )}
                      Registered Role: {debugData.config?.registered_role_name || "Not Found"}
                    </Badge>
                    <Badge variant="outline" className="bg-gradient-to-r from-ice-blue-100 to-ice-blue-100 dark:from-ice-blue-900/20 dark:to-ice-blue-900/20 text-ice-blue-700 dark:text-ice-blue-300 border-ice-blue-200 dark:border-ice-blue-700">
                      <Users className="mr-1 h-3 w-3" />
                      Discord Users: {debugData.database?.discord_users_count || 0}
                    </Badge>
                    <Badge variant="outline" className="bg-gradient-to-r from-rink-blue-100 to-rink-blue-100 dark:from-rink-blue-900/20 dark:to-rink-blue-900/20 text-rink-blue-700 dark:text-rink-blue-300 border-rink-blue-200 dark:border-rink-blue-700">
                      <Crown className="mr-1 h-3 w-3" />
                      Total Roles: {debugData.roles?.total || 0}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Available Roles */}
              {debugData.roles?.all_roles && (
                <Card className="hockey-card border-assist-green-200/50 dark:border-assist-green-700/50 bg-gradient-to-br from-white to-assist-green-50/50 dark:from-hockey-silver-900 dark:to-assist-green-900/20">
                  <CardHeader className="border-b border-assist-green-200/50 dark:border-assist-green-700/50 pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg font-semibold text-hockey-silver-800 dark:text-hockey-silver-200">
                      <div className="p-1.5 bg-gradient-to-r from-assist-green-500 to-assist-green-600 rounded">
                        <Hash className="h-4 w-4 text-white" />
                      </div>
                      Available Roles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="max-h-60 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {debugData.roles.all_roles.map((role: any) => (
                          <div key={role.id} className="flex justify-between items-center p-3 bg-gradient-to-r from-assist-green-100/30 to-assist-green-100/30 dark:from-assist-green-900/10 dark:to-assist-green-900/10 rounded-lg border border-assist-green-200/30 dark:border-assist-green-700/30 hover:shadow-md transition-all duration-200">
                            <span className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200">{role.name}</span>
                            <Badge variant="outline" className="text-xs bg-gradient-to-r from-assist-green-100 to-assist-green-100 dark:from-assist-green-900/20 dark:to-assist-green-900/20 text-assist-green-700 dark:text-assist-green-300 border-assist-green-200 dark:border-assist-green-700">
                              {role.id}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Role Assignment Card */}
      <Card className="hockey-card hockey-card-hover border-goal-red-200/50 dark:border-goal-red-700/50 bg-gradient-to-br from-white to-goal-red-50/50 dark:from-hockey-silver-900 dark:to-goal-red-900/20 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="border-b-2 border-goal-red-200/50 dark:border-goal-red-700/50 pb-4">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold text-hockey-silver-800 dark:text-hockey-silver-200">
            <div className="p-2 bg-gradient-to-r from-goal-red-500 to-goal-red-600 rounded-lg">
              <Target className="h-6 w-6 text-white" />
            </div>
            Test Role Assignment
          </CardTitle>
          <CardDescription className="text-hockey-silver-600 dark:text-hockey-silver-400 text-base">Test assigning the registered role to a specific Discord user.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div className="space-y-3">
            <Label htmlFor="test_user_id" className="text-sm font-medium text-hockey-silver-800 dark:text-hockey-silver-200 flex items-center gap-2">
              <Users className="h-4 w-4 text-goal-red-600 dark:text-goal-red-400" />
              Discord User ID
            </Label>
            <Input
              id="test_user_id"
              value={testUserId}
              onChange={(e) => setTestUserId(e.target.value)}
              placeholder="Enter Discord user ID to test"
              className="hockey-search border-goal-red-200/50 dark:border-goal-red-700/50 focus:ring-goal-red-500/20 focus:border-goal-red-500"
            />
          </div>
          <Button 
            onClick={testRoleAssignment} 
            disabled={testing || !testUserId}
            className="hockey-button bg-gradient-to-r from-goal-red-500 to-goal-red-600 hover:from-goal-red-600 hover:to-goal-red-700 text-white border-0 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
            Test Role Assignment
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
