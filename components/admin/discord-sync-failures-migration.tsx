"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function DiscordSyncFailuresMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/discord-sync-failures-table", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({ success: false, message: error.message })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Discord Sync Failures Table Migration</CardTitle>
        <CardDescription>
          Creates a table to track failed Discord role sync attempts for retry and monitoring.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="font-medium">This migration will:</h4>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
            <li>Create discord_sync_failures table</li>
            <li>Add indexes for performance</li>
            <li>Set up RLS policies for admin access</li>
            <li>Enable failure tracking and retry mechanisms</li>
          </ul>
        </div>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
