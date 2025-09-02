"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, RefreshCw, Database } from "lucide-react"

export default function DiscordBotConfigMigration() {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/discord-bot-config-table", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Migration failed")
      }

      setResult(data)
      toast({
        title: "Migration completed",
        description: "Discord bot config table migration completed successfully",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Discord Bot Config Table Migration
        </CardTitle>
        <CardDescription>
          Creates the discord_bot_config table with proper constraints and default configuration. This migration will
          also clean up any duplicate configurations.
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
                <Database className="mr-2 h-4 w-4" />
                Run Discord Bot Config Migration
              </>
            )}
          </Button>
        </div>

        {result && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {result.success ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Success
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  <AlertCircle className="mr-1 h-3 w-3" />
                  Failed
                </Badge>
              )}
            </div>

            {result.success && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-green-800 font-medium">{result.message}</p>
                <div className="mt-2 space-y-1 text-sm text-green-700">
                  <p>✓ Table exists: {result.tableExists ? "Yes" : "No"}</p>
                  <p>✓ Has default config: {result.hasDefaultConfig ? "Yes" : "No"}</p>
                  <p>✓ Duplicate configs cleaned up</p>
                  <p>✓ Singleton constraint added</p>
                  <p>✓ RLS policies configured</p>
                </div>
              </div>
            )}

            {result.error && (
              <div className="bg-red-50 border border-red-200 rounded p-3">
                <p className="text-red-800 font-medium">Migration failed:</p>
                <p className="text-red-700 text-sm mt-1">{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">This migration will:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Create the discord_bot_config table if it doesn't exist</li>
            <li>Remove any duplicate configuration rows (keeping the most recent)</li>
            <li>Add a singleton constraint to prevent multiple configs</li>
            <li>Insert default bot configuration if none exists</li>
            <li>Enable Row Level Security with admin-only access</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
