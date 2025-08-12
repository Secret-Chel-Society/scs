"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Database } from "lucide-react"

export default function DailyRecapsTableMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setResult(null)
    setError(null)

    try {
      const response = await fetch("/api/admin/run-migration/daily-recaps-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.success) {
        setResult("Daily recaps table migration completed successfully!")
      } else {
        setError(data.error || "Migration failed")
      }
    } catch (err: any) {
      setError(err.message || "Failed to run migration")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Daily Recaps Table Migration
        </CardTitle>
        <CardDescription>Create the daily_recaps table if it doesn't exist</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>

        {result && (
          <Alert>
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
