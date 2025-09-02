"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"

export const EaClubIdMigration = () => {
  const { toast } = useToast()
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const runMigration = async () => {
    try {
      setIsRunning(true)
      setIsComplete(false)

      const response = await fetch("/api/admin/run-migration/ea-club-id", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run migration")
      }

      setIsComplete(true)
      toast({
        title: "Migration Complete",
        description: "EA Club ID column has been added to the teams table.",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      toast({
        title: "Migration Failed",
        description: error.message || "An error occurred while running the migration",
        variant: "destructive",
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add EA Club ID to Teams</CardTitle>
        <CardDescription>
          This migration adds an EA Club ID column to the teams table, allowing integration with EA Sports NHL API.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This will add a new column to the teams table to store EA Club IDs. These IDs are used to fetch team stats and
          match data from EA Sports NHL.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">{isComplete && "Migration completed successfully."}</div>
        <Button onClick={runMigration} disabled={isRunning || isComplete}>
          {isRunning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isComplete ? "Migration Complete" : isRunning ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}

// Add default export that re-exports the named export for backward compatibility
export default EaClubIdMigration
