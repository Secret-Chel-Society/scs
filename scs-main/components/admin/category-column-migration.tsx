"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Database, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function CategoryColumnMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; message?: string; error?: string } | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)
      setDebugInfo(null)

      const response = await fetch("/api/admin/run-migration/add-category-column", {
        method: "POST",
      })

      const data = await response.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Migration successful",
          description: "The category column has been added to the ea_player_stats table.",
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
        <CardTitle>Add Category Column Migration</CardTitle>
        <CardDescription>
          This migration adds the 'category' column to the ea_player_stats table to store player position categories.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This migration will add the 'category' column to the ea_player_stats table. This column is used to categorize
          players as 'offense', 'defense', or 'goalie' based on their position.
        </p>

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
