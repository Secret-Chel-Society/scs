"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react"

export function EaMatchDataMigration() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)

  const runMigration = async () => {
    try {
      setLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/admin/run-migration/add-ea-match-data", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setSuccess(true)
      setResult(data)
    } catch (err: any) {
      console.error("Migration error:", err)
      setError(err.message || "An error occurred while running the migration")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Add EA Match Data Column Migration</CardTitle>
        <CardDescription>
          This migration adds the <code className="bg-muted px-1 py-0.5 rounded">ea_match_data</code> column to the
          matches table. This column is required for storing EA Sports NHL match data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Migration Successful</AlertTitle>
            <AlertDescription className="text-green-700">
              The ea_match_data column has been added to the matches table.
            </AlertDescription>
            {result && (
              <pre className="mt-2 p-2 bg-green-100 rounded text-xs overflow-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </Alert>
        )}

        <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
          <h3 className="text-amber-800 font-medium mb-2">Migration Details</h3>
          <p className="text-amber-700 text-sm">
            This migration will add a JSONB column named{" "}
            <code className="bg-amber-100 px-1 py-0.5 rounded">ea_match_data</code> to the matches table. This column is
            used to store the raw data from the EA Sports NHL API for each match.
          </p>
          <p className="text-amber-700 text-sm mt-2">
            The column is required for the EA match import functionality to work correctly.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={loading || success} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : success ? (
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
