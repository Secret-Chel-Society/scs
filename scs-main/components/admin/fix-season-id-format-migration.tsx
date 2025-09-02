"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function FixSeasonIdFormatMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/admin/run-migration/fix-season-id-format", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult(data)
      toast({
        title: "Migration successful",
        description: "The season ID format has been fixed.",
      })
    } catch (err: any) {
      setError(err.message)
      toast({
        title: "Migration failed",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fix Season ID Format</CardTitle>
        <CardDescription>
          This migration fixes the season ID format in the system_settings table to ensure it's a valid UUID.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          If the current_season value in system_settings is not a valid UUID, this migration will update it to use the
          ID of the most recent season.
        </p>

        {error && (
          <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-muted p-3 rounded-md mb-4">
            <div className="flex items-start gap-2 mb-2">
              <CheckCircle className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{result.message}</p>
            </div>
            <div className="text-xs font-mono whitespace-pre-wrap mt-2">
              <p>
                <strong>Current Season ID:</strong> {result.currentSeason}
              </p>
              <p className="mt-2">
                <strong>Available Seasons:</strong>
              </p>
              <ul className="list-disc list-inside">
                {result.availableSeasons?.map((season: any) => (
                  <li key={season.id}>
                    {season.name} (ID: {season.id})
                  </li>
                ))}
              </ul>
            </div>
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
