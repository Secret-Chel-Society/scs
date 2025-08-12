"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function SeasonRelationshipMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/run-migration/season-relationship", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      toast({
        title: "Migration successful",
        description: "The season relationship migration was completed successfully.",
      })
      setIsComplete(true)
    } catch (error: any) {
      console.error("Migration error:", error)
      toast({
        title: "Migration failed",
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
        <CardTitle>Season Relationship Migration</CardTitle>
        <CardDescription>
          Run this migration to ensure the relationship between matches and seasons is properly set up.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will add a season_id column to the matches table if it doesn't exist, and create a foreign key
          relationship to the seasons table.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading || isComplete}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Migration...
            </>
          ) : isComplete ? (
            "Migration Complete"
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
