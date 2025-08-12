"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function EaPlayerStatsUpdateMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runMigration = async () => {
    try {
      setIsLoading(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/update-ea-player-stats", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "EA player stats table updated successfully",
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to update EA player stats table",
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An unexpected error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update EA Player Stats Table</CardTitle>
        <CardDescription>
          Add additional columns to the EA player stats table for more detailed statistics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will add new columns to the EA player stats table to support more detailed player statistics
          including passing stats, zone time, puck control metrics, faceoff details, and goalie-specific stats.
        </p>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading}>
          {isLoading ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
