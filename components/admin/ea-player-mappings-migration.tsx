"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

export function EaPlayerMappingsMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const runMigration = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/run-migration/ea-player-mappings", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to run migration")
      }

      toast({
        title: "Migration successful",
        description: "EA player mappings table has been created.",
      })
      setIsComplete(true)
    } catch (error) {
      console.error("Migration error:", error)
      toast({
        title: "Migration failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>EA Player Mappings Migration</CardTitle>
        <CardDescription>Create a table to map EA player personas to MGHL player IDs</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This migration will create a new table called <code>ea_player_mappings</code> that allows you to manually map
          EA player personas (like &quot;LispDoge&quot;) to MGHL player IDs.
        </p>
        <Button onClick={runMigration} disabled={isLoading || isComplete}>
          {isLoading ? "Running Migration..." : isComplete ? "Migration Complete" : "Run Migration"}
        </Button>
      </CardContent>
    </Card>
  )
}
