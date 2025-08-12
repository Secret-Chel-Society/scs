"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react"

export default function EnsureDiscordTablesMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/ensure-discord-tables", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Migration Successful",
          description: "Discord tables have been created and configured successfully.",
        })
      } else {
        toast({
          title: "Migration Failed",
          description: data.error || "An error occurred during migration.",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      const errorResult = {
        success: false,
        error: error.message,
      }
      setResult(errorResult)

      toast({
        title: "Migration Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <RefreshCw className="h-5 w-5" />
          Ensure Discord Tables Migration
        </CardTitle>
        <CardDescription>
          Creates all necessary Discord integration tables with proper RLS policies and default configuration.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={runMigration} disabled={isRunning}>
            {isRunning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Run Migration
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="mt-4 p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">{result.success ? "Success" : "Error"}</span>
            </div>
            <p className="text-sm text-muted-foreground">{result.success ? result.message : result.error}</p>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p>This migration will:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Create discord_bot_config table</li>
            <li>Create discord_users table</li>
            <li>Create discord_team_roles table</li>
            <li>Create discord_management_roles table</li>
            <li>Create twitch_users table</li>
            <li>Create live_streams table</li>
            <li>Add discord_id column to users table</li>
            <li>Add discord_role_id column to teams table</li>
            <li>Set up proper RLS policies</li>
            <li>Insert default bot configuration</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
