"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PlayerStatisticsStructureMigration() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setResult(null)

      const response = await fetch("/api/admin/run-migration/player-statistics-structure", {
        method: "POST",
      })

      const data = await response.json()

      if (response.ok) {
        setResult(`Migration successful: ${data.message}`)
        toast({
          title: "Migration Successful",
          description: data.message,
        })
      } else {
        setResult(`Migration failed: ${data.error}`)
        toast({
          title: "Migration Failed",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      console.error("Error running migration:", error)
      setResult(`Error: ${error.message}`)
      toast({
        title: "Migration Failed",
        description: `An error occurred: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Player Statistics Structure Migration</CardTitle>
        <CardDescription>
          Ensures the player_statistics table has the correct structure for storing player statistics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will create the player_statistics table if it doesn't exist, or add any missing columns if it
          does. This is required for the player statistics sync feature to work properly.
        </p>
        {result && (
          <div
            className={`p-3 rounded-md text-sm ${result.includes("failed") || result.includes("Error") ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"}`}
          >
            {result}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isRunning}>
          {isRunning ? (
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
