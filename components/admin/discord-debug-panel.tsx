"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, AlertTriangle, CheckCircle, Bug } from "lucide-react"

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
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Bug className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Discord Bot Debug</h1>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
            <CardDescription>Check bot permissions and configuration status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={runDebug} disabled={loading}>
              {loading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Bug className="mr-2 h-4 w-4" />}
              Run Debug Check
            </Button>

            {debugData && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Guild Information</h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Name:</strong> {debugData.guild?.name}
                      </p>
                      <p>
                        <strong>ID:</strong> {debugData.guild?.id}
                      </p>
                      <p>
                        <strong>Members:</strong> {debugData.guild?.member_count}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Bot Information</h3>
                    <div className="text-sm space-y-1">
                      <p>
                        <strong>Username:</strong> {debugData.bot?.username}
                      </p>
                      <p>
                        <strong>ID:</strong> {debugData.bot?.id}
                      </p>
                      <p>
                        <strong>Roles:</strong> {debugData.bot?.roles?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Configuration Status</h3>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={debugData.config?.registered_role_exists ? "default" : "destructive"}>
                      {debugData.config?.registered_role_exists ? (
                        <CheckCircle className="mr-1 h-3 w-3" />
                      ) : (
                        <AlertTriangle className="mr-1 h-3 w-3" />
                      )}
                      Registered Role: {debugData.config?.registered_role_name || "Not Found"}
                    </Badge>
                    <Badge variant="outline">Discord Users: {debugData.database?.discord_users_count || 0}</Badge>
                    <Badge variant="outline">Total Roles: {debugData.roles?.total || 0}</Badge>
                  </div>
                </div>

                {debugData.roles?.all_roles && (
                  <div className="space-y-2">
                    <h3 className="font-semibold">Available Roles</h3>
                    <div className="max-h-40 overflow-y-auto">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {debugData.roles.all_roles.map((role: any) => (
                          <div key={role.id} className="flex justify-between items-center p-2 border rounded">
                            <span>{role.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {role.id}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Role Assignment</CardTitle>
            <CardDescription>Test assigning the registered role to a specific Discord user.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="test_user_id">Discord User ID</Label>
              <Input
                id="test_user_id"
                value={testUserId}
                onChange={(e) => setTestUserId(e.target.value)}
                placeholder="Enter Discord user ID to test"
              />
            </div>
            <Button onClick={testRoleAssignment} disabled={testing || !testUserId}>
              {testing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              Test Role Assignment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
