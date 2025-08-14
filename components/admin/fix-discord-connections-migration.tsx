"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"

export default function FixDiscordConnectionsMigration() {
  const [running, setRunning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [results, setResults] = useState<any>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setRunning(true)

      const adminKey = localStorage.getItem("mghl-admin-key")
      if (!adminKey) {
        toast({
          title: "Admin key required",
          description: "Please set your admin key in the user management panel first.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/admin/run-migration/fix-discord-connections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ adminKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Migration failed")
      }

      setResults(data.results)
      setCompleted(true)

      toast({
        title: "Migration completed",
        description: "Discord connections have been fixed successfully.",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      toast({
        title: "Migration failed",
        description: error.message || "An error occurred during migration",
        variant: "destructive",
      })
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Fix Discord Connections Migration
            </CardTitle>
            <CardDescription>
              This migration fixes Discord connection issues by ensuring the discord_id column exists on the users table
              and is properly populated from the discord_users table.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
              <h3 className="font-medium text-amber-800 mb-2">What this migration does:</h3>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• Adds discord_id column to users table if missing</li>
                <li>• Populates discord_id from discord_users table</li>
                <li>• Adds discord_role_id column to teams table if missing</li>
                <li>• Creates necessary indexes for performance</li>
              </ul>
            </div>

            {completed && results && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <h3 className="font-medium text-green-800">Migration Results</h3>
                </div>
                <div className="text-sm text-green-700 space-y-1">
                  <p>Users with Discord ID: {results.usersWithDiscordId}</p>
                  <p>Teams with Discord roles: {results.teamsWithDiscordRoles}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={runMigration} disabled={running || completed}>
                {running ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running Migration...
                  </>
                ) : completed ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Migration Completed
                  </>
                ) : (
                  "Run Migration"
                )}
              </Button>

              {completed && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setCompleted(false)
                    setResults(null)
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
