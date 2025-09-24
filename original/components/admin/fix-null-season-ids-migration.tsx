"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function FixNullSeasonIdsMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function runMigration() {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/fix-null-season-ids", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run migration")
      }

      const data = await response.json()
      setResult(data.message)
      setIsComplete(true)
    } catch (err: any) {
      console.error("Error running migration:", err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Fix Null Season IDs Migration</CardTitle>
        <CardDescription>
          This migration will update any season registrations that have a null season_id but a valid season_number. It
          will set their season_id to match the corresponding season.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isComplete && result && (
          <Alert className="mb-4 bg-green-50 dark:bg-green-900/20">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle>Migration Complete</AlertTitle>
            <AlertDescription>{result}</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-muted-foreground mb-4">This will update all season registrations where:</p>
        <ul className="list-disc pl-5 mb-4 text-sm text-muted-foreground space-y-1">
          <li>The season_id is null</li>
          <li>The season_number is valid and matches an existing season</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          This ensures that all registrations are properly linked to their seasons.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading || isComplete}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Migration Complete
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
