"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function FixUserTeamManager() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [userId, setUserId] = useState("")
  const [teamId, setTeamId] = useState("")
  const [role, setRole] = useState("Owner")
  const { toast } = useToast()

  const fixTeamManager = async () => {
    try {
      setLoading(true)
      setResult(null)

      if (!userId || !teamId || !role) {
        throw new Error("All fields are required")
      }

      const response = await fetch("/api/admin/fix-team-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          teamId,
          role,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix team manager")
      }

      setResult({
        success: true,
        message: data.message || "Team manager fixed successfully",
      })

      toast({
        title: "Success",
        description: data.message || "Team manager fixed successfully",
      })
    } catch (error: any) {
      console.error("Error fixing team manager:", error)
      setResult({
        success: false,
        message: error.message || "An error occurred while fixing team manager",
      })

      toast({
        title: "Error",
        description: error.message || "Failed to fix team manager",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix User Team Manager</CardTitle>
        <CardDescription>
          This tool allows you to manually add or update a team manager entry for a specific user.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-id">User ID</Label>
            <Input
              id="user-id"
              placeholder="Enter user ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">The UUID of the user to fix</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-id">Team ID</Label>
            <Input
              id="team-id"
              placeholder="Enter team ID"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">The UUID of the team to associate with the user</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Owner">Owner</SelectItem>
                <SelectItem value="GM">GM</SelectItem>
                <SelectItem value="AGM">AGM</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">The role to assign to the user for this team</p>
          </div>

          {result && (
            <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
              {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={fixTeamManager} disabled={loading || !userId || !teamId || !role}>
          {loading ? "Fixing..." : "Fix Team Manager"}
        </Button>
      </CardFooter>
    </Card>
  )
}
