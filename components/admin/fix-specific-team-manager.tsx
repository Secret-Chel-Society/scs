"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

export default function FixSpecificTeamManager() {
  const [userId, setUserId] = useState("")
  const [teamId, setTeamId] = useState("")
  const [role, setRole] = useState("Manager")
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/fix-specific-team-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, teamId, role }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to fix team manager")
      }

      setResult(data)
      toast({
        title: "Success",
        description: data.message,
      })
    } catch (error) {
      console.error("Error fixing team manager:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fix team manager",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Fix Specific Team Manager</CardTitle>
        <CardDescription>Add or update a specific user as a team manager for a specific team</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user UUID"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="teamId">Team ID</Label>
            <Input
              id="teamId"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="Enter team UUID"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Owner">Owner</SelectItem>
                <SelectItem value="GM">GM</SelectItem>
                <SelectItem value="AGM">AGM</SelectItem>
                <SelectItem value="Coach">Coach</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Processing..." : "Fix Team Manager"}
          </Button>
        </form>
      </CardContent>
      {result && (
        <CardFooter className="flex flex-col items-start">
          <h3 className="text-lg font-semibold">Result:</h3>
          <pre className="mt-2 p-4 bg-gray-100 rounded-md overflow-auto w-full">{JSON.stringify(result, null, 2)}</pre>
        </CardFooter>
      )}
    </Card>
  )
}
