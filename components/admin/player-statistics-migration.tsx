"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Database } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

export function PlayerStatisticsMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/admin/run-migration/player-statistics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to run migration")
      }

      setSuccess(true)
      toast({
        title: "Migration successful",
        description: "Player statistics table has been created successfully.",
      })
    } catch (err: any) {
      console.error("Migration error:", err)
      setError(err.message || "An error occurred while running the migration")
      toast({
        title: "Migration failed",
        description: err.message || "An error occurred while running the migration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Player Statistics Table
        </CardTitle>
        <CardDescription>Create the player statistics table to track player performance across seasons</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 text-green-500">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>Player statistics table has been created successfully.</AlertDescription>
          </Alert>
        )}

        <p className="text-sm text-muted-foreground mb-4">
          This migration will create a new table to store player statistics including games played, goals, assists,
          points, plus/minus, and more. This data will be used to display player performance on team lineups and player
          profiles.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading}>
          {isLoading ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
