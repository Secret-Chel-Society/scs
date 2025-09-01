"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"

export function EaTeamStatsMigration() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  const runMigration = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/ea-team-stats", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setSuccess(true)
      setResult(data.message || "Migration completed successfully")
    } catch (err: any) {
      console.error("Error running migration:", err)
      setError(err.message || "An error occurred while running the migration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>EA Team Stats Migration</CardTitle>
        <CardDescription>Creates a new table to store team-level statistics from EA Sports NHL matches</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will create a new <code className="bg-muted px-1 py-0.5 rounded">ea_team_stats</code> table to
          store team statistics from EA Sports NHL matches. This includes goals, shots, hits, power play stats, and
          more.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Success</AlertTitle>
            <AlertDescription className="text-green-700">{result}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading}>
          {loading ? (
            <>
              <Skeleton className="h-4 w-4 rounded-full animate-pulse mr-2" />
              Running Migration...
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
