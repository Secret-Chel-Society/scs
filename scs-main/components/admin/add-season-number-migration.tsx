"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react"

export function AddSeasonNumberMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success?: boolean
    message?: string
    error?: string
    seasons?: Array<{ id: string; name: string; season_number?: number }>
  } | null>(null)

  const runMigration = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/add-season-number", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({
          success: false,
          error: data.error || "Failed to run migration",
        })
        return
      }

      setResult({
        success: true,
        message: data.message,
        seasons: data.seasons,
      })
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Season Number Migration</CardTitle>
        <CardDescription>
          This migration adds the season_number column to the seasons table if it doesn't exist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">This will:</p>
        <ol className="list-decimal list-inside space-y-1 mb-4">
          <li>Add the season_number column to the seasons table if it doesn't exist</li>
          <li>Populate the column with values extracted from season names where possible</li>
          <li>Assign sequential numbers to any remaining seasons</li>
        </ol>

        {result && (
          <div className="mt-4">
            {result.success ? (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>{result.message}</AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{result.error}</AlertDescription>
              </Alert>
            )}

            {result.success && result.seasons && result.seasons.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Seasons:</h3>
                <div className="bg-muted p-3 rounded-md overflow-auto max-h-60">
                  <table className="min-w-full">
                    <thead>
                      <tr>
                        <th className="text-left text-xs font-medium text-muted-foreground p-2">Season Number</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-2">Name</th>
                        <th className="text-left text-xs font-medium text-muted-foreground p-2">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.seasons.map((season) => (
                        <tr key={season.id} className="border-t border-muted-foreground/20">
                          <td className="p-2 text-sm">{season.season_number || "N/A"}</td>
                          <td className="p-2 text-sm">{season.name}</td>
                          <td className="p-2 text-sm font-mono text-xs">{season.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
