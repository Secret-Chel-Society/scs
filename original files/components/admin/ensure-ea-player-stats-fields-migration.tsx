"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react"

export function EnsureEaPlayerStatsFieldsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
    debug?: string
  } | null>(null)

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/ensure-ea-player-stats-fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error: any) {
      setResult({
        success: false,
        error: error.message || "An unknown error occurred",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ensure EA Player Stats Fields</CardTitle>
        <CardDescription>
          This migration ensures all necessary fields exist in the ea_player_stats table for storing EA Sports NHL
          player statistics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This migration will add the following fields to the ea_player_stats table if they don't already exist:
        </p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>interceptions</li>
          <li>ppg (Power Play Goals)</li>
          <li>shg (Short-handed Goals)</li>
          <li>time_with_puck</li>
          <li>season_id</li>
          <li>skshg (Raw EA field for short-handed goals)</li>
        </ul>

        {result && (
          <Alert
            variant={result.success ? "default" : "destructive"}
            className={result.success ? "bg-green-50 border-green-200" : ""}
          >
            {result.success ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message || result.error}</AlertDescription>
            {result.debug && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-auto">
                <pre>{result.debug}</pre>
              </div>
            )}
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Run Migration
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
