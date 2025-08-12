"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2 } from "lucide-react"

export function GoalieColumnsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/goalie-columns", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult({
          success: true,
          message: data.message || "Migration completed successfully",
        })
      } else {
        setResult({
          success: false,
          message: data.error || "Failed to run migration",
        })
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "An unknown error occurred",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Missing Goalie Columns Migration</CardTitle>
        <CardDescription>
          This migration adds missing goalie-related columns to the ea_player_stats table.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will add the following columns if they don't exist: glga, glsaves, glsavepct, glshots, and glgaa. These
          columns are needed to store goalie statistics from EA Sports NHL.
        </p>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
