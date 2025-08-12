"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"

export function LineupsMigration() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string; message?: string } | null>(null)

  const runMigration = async () => {
    try {
      setLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/lineups-table", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({ success: true, message: data.message || "Migration completed successfully" })
      } else {
        setResult({
          success: false,
          error: data.error || "Failed to run migration",
          message: data.details || "Unknown error",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        error: "Migration failed",
        message: error.message || "An unexpected error occurred",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lineups Table Migration</CardTitle>
        <CardDescription>Create the necessary database tables to manage team lineups for matches</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will create a new table for storing lineup information. This allows administrators to set team
          lineups for upcoming matches, including player positions and line assignments.
        </p>

        {result && (
          <Alert className={result.success ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30"}>
            {result.success ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>
              {result.message}
              {result.error && <div className="text-sm mt-2 text-red-600 dark:text-red-400">{result.error}</div>}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {loading ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
