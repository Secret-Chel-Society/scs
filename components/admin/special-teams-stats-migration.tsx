"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function SpecialTeamsStatsMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/run-migration/special-teams-stats", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setIsComplete(true)
      toast({
        title: "Migration Successful",
        description: "Special teams stats columns have been added to the teams table.",
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
        <CardTitle>Special Teams Stats Migration</CardTitle>
        <CardDescription>
          Add powerplay and penalty kill statistics columns to the teams table if they don't exist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will add the following columns to the teams table:
        </p>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1 mb-4">
          <li>powerplay_goals</li>
          <li>powerplay_opportunities</li>
          <li>penalty_kill_goals_against</li>
          <li>penalty_kill_opportunities</li>
        </ul>
        <p className="text-sm text-muted-foreground">
          These columns are used to calculate powerplay and penalty kill percentages in the standings page.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading || isComplete}>
          {isLoading ? "Running Migration..." : isComplete ? "Migration Complete" : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
