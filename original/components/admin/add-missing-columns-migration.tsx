"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle } from "lucide-react"

export function AddMissingColumnsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/add-missing-columns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        setResult({ success: false, error: data.error || "Failed to run migration" })
        return
      }

      setResult({ success: true, message: data.message || "Migration completed successfully" })
    } catch (error: any) {
      setResult({ success: false, error: error.message || "An error occurred" })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Missing EA Player Stats Columns</CardTitle>
        <CardDescription>
          This migration adds missing columns to the ea_player_stats table, including glga, games_played, and category.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.success ? result.message : result.error}</AlertDescription>
          </Alert>
        )}
        <p>
          This migration will check for and add the following columns to the ea_player_stats table if they don't exist:
        </p>
        <ul className="list-disc pl-5 mt-2">
          <li>glga - Text column for goalie goals against</li>
          <li>games_played - Integer column with default value of 1</li>
          <li>category - Text column for player category (goalie, defense, offense)</li>
        </ul>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
