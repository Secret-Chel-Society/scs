"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface RunLineupsMigrationProps {
  onComplete?: () => void
}

export function RunLineupsMigration({ onComplete }: RunLineupsMigrationProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setError(null)

    try {
      const response = await fetch("/api/management/create-lineups-table", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // ✅ CRITICAL: send auth cookies to the route handler
        credentials: "include",
      })

      // ✅ Better error parsing (works if server returns non-JSON too)
      if (!response.ok) {
        const contentType = response.headers.get("content-type") || ""
        let message = `Failed to run migration (${response.status})`

        if (contentType.includes("application/json")) {
          const errorData = await response.json().catch(() => null)
          message =
            errorData?.error ||
            errorData?.message ||
            errorData?.details ||
            message
        } else {
          const text = await response.text().catch(() => "")
          if (text) message = text
        }

        throw new Error(message)
      }

      setIsComplete(true)

      if (onComplete) {
        setTimeout(() => {
          onComplete()
        }, 1500)
      }
    } catch (err: any) {
      console.error("Error running migration:", err)
      setError(err?.message || "An error occurred while setting up the lineups table")
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Required</CardTitle>
        <CardDescription>The lineups table needs to be created before you can manage team lineups.</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isComplete ? (
          <Alert
            variant="success"
            className="mb-4 bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
          >
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-600 dark:text-green-400">Setup Complete</AlertTitle>
            <AlertDescription className="text-green-600 dark:text-green-400">
              The lineups table has been created successfully. You can now manage team lineups.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <p>
              This is a one-time setup that creates the necessary database table for managing team lineups. As a team
              manager, you have permission to run this setup.
            </p>
            <p className="text-muted-foreground text-sm">
              This will create a new table called "lineups" in the database that will store lineup information for all
              matches.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {!isComplete && (
          <Button onClick={runMigration} disabled={isRunning}>
            {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isRunning ? "Setting Up..." : "Create Lineups Table"}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
