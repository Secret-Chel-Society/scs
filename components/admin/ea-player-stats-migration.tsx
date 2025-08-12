"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export function EaPlayerStatsMigration() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/admin/run-migration/ea-player-stats")
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("Error running EA player stats migration:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EA Player Stats Table Migration</CardTitle>
        <CardDescription>
          Create the EA player stats table to store detailed player statistics from EA Sports NHL matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will create a new table to store detailed player statistics from EA Sports NHL matches. This
          table is required to display player statistics on match detail pages.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>EA player stats table migration completed successfully</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Migration...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
