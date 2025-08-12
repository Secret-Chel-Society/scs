"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function EaStatsFieldsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)
      setDebugInfo(null)

      const response = await fetch("/api/admin/run-migration/add-more-ea-fields", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Migration successful",
          description: "All EA stats fields have been added to the database.",
          variant: "default",
        })
      } else {
        toast({
          title: "Migration failed",
          description: data.error || "An unknown error occurred",
          variant: "destructive",
        })
      }

      // Add debug info
      if (data.debug) {
        setDebugInfo(data.debug)
      }
    } catch (error: any) {
      console.error("Error running migration:", error)
      setResult({
        success: false,
        error: error.message || "An unknown error occurred",
      })
      toast({
        title: "Error",
        description: error.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add EA Stats Fields Migration</CardTitle>
        <CardDescription>
          This migration adds all required EA stats fields to the database to ensure all player statistics are properly
          stored and displayed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">This migration will add the following fields to the ea_player_stats table:</p>
        <ul className="list-disc pl-6 mb-4 space-y-1">
          <li>skinterceptions - Interceptions</li>
          <li>skfow - Faceoffs Won</li>
          <li>skfol - Faceoffs Lost</li>
          <li>skpenaltiesdrawn - Penalties Drawn</li>
          <li>skpasses - Passes Completed</li>
          <li>skpassattempts - Pass Attempts</li>
          <li>skpossession - Time with Puck</li>
          <li>skppg - Power Play Goals</li>
          <li>glgaa - Goalie Goals Against Average</li>
          <li>glshots - Goalie Shots Against</li>
          <li>glsaves - Goalie Saves</li>
          <li>glga - Goalie Goals Against</li>
          <li>glsavepct - Goalie Save Percentage</li>
          <li>toiseconds - Time on Ice in Seconds</li>
        </ul>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mb-4">
            {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.success ? result.message : result.error}</AlertDescription>
          </Alert>
        )}

        {debugInfo && (
          <div className="mt-4 p-3 bg-muted rounded-md overflow-auto max-h-60 text-xs">
            <pre>{debugInfo}</pre>
          </div>
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
