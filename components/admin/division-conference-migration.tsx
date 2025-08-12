"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function DivisionConferenceMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/admin/run-migration/division-conference", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run migration")
      }

      setIsComplete(true)
      toast({
        title: "Migration Complete",
        description: "Division and conference columns have been added to the teams table.",
      })
    } catch (error: any) {
      toast({
        title: "Migration Failed",
        description: error.message || "An error occurred while running the migration.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Division and Conference Migration</CardTitle>
        <CardDescription>
          Adds division and conference columns to the teams table and populates them with default values.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration adds division and conference columns to the teams table if they don't exist, and populates them
          with default values based on team names. This is used by the standings calculator to group teams by division.
        </p>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={runMigration} disabled={isLoading || isComplete}>
          {isLoading ? "Running Migration..." : isComplete ? "Migration Complete" : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
