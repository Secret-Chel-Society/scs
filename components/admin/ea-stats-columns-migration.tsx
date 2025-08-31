"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function EaStatsColumnsMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/ea-stats-columns", {
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
        description: "EA stats columns migration has been completed.",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      setResult({
        success: false,
        message: error.message || "An error occurred while running the migration",
      })

      toast({
        title: "Migration Failed",
        description: error.message || "Failed to run EA stats columns migration",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EA Stats Columns Migration</CardTitle>
        <CardDescription>
          Add EA stats columns to the database for enhanced statistics tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">This migration will add EA stats columns to support enhanced statistics tracking and reporting.</p>

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
