"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, Database, CheckCircle, AlertCircle } from "lucide-react"

export default function DiscordIntegrationMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/discord-integration", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Migration completed",
          description: "Discord integration tables have been created successfully.",
        })
      } else {
        toast({
          title: "Migration failed",
          description: data.error || "Unknown error occurred",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error running migration:", error)
      setResult({
        success: false,
        error: error.message,
      })
      toast({
        title: "Migration failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Database className="h-8 w-8" />
        <h1 className="text-3xl font-bold">Discord Integration Migration</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create Discord Integration Tables</CardTitle>
          <CardDescription>
            This migration will create all necessary database tables for Discord bot integration, including bot
            configuration, user connections, role mappings, and Twitch integration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Tables to be created:</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>discord_bot_config - Bot configuration and credentials</li>
              <li>discord_users - User Discord account connections</li>
              <li>discord_team_roles - Team role mappings</li>
              <li>discord_management_roles - Management role mappings</li>
              <li>twitch_users - Twitch account connections</li>
              <li>live_streams - Active stream tracking</li>
            </ul>
          </div>

          <Button onClick={runMigration} disabled={isRunning} className="w-full">
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Run Discord Integration Migration
              </>
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-semibold">{result.success ? "Success" : "Error"}</span>
              </div>
              <p className="text-sm">{result.message || result.error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
