"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AddMoreEaColumnsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/add-more-ea-columns", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult({
        success: true,
        message: data.message || "Migration completed successfully",
      })

      toast({
        title: "Migration Successful",
        description: "Additional EA player stats columns have been added to the database.",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      setResult({
        success: false,
        message: error.message || "An error occurred while running the migration",
      })

      toast({
        title: "Migration Failed",
        description: error.message || "Failed to add EA player stats columns",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Additional EA Player Stats Columns</CardTitle>
        <CardDescription>
          This migration adds more columns to the ea_player_stats table to support additional statistics from the EA
          Sports NHL API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">This migration will add the following columns if they don't already exist:</p>
        <ul className="list-disc pl-5 mb-4 space-y-1">
          <li>toiseconds (Time on Ice in seconds)</li>
          <li>defensive_zone_time</li>
          <li>offensive_zone_time</li>
          <li>neutral_zone_time</li>
          <li>shot_attempts</li>
          <li>shot_pct (Shot Percentage)</li>
          <li>faceoffs_won</li>
          <li>faceoffs_taken</li>
          <li>faceoff_pct (Faceoff Percentage)</li>
        </ul>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning} className="w-full">
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Run Migration
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
