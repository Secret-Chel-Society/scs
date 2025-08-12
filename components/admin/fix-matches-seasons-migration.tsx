"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Link2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function FixMatchesSeasonsMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/admin/run-migration/fix-matches-seasons", {
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
        description: "The matches-seasons relationship has been fixed successfully.",
      })
      setIsComplete(true)
    } catch (error: any) {
      console.error("Migration error:", error)
      setError(error.message || "An error occurred while running the migration")
      toast({
        title: "Migration failed",
        description: error.message || "An error occurred while running the migration",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5" />
          Fix Matches-Seasons Relationship
        </CardTitle>
        <CardDescription>
          Fix the relationship between matches and seasons tables to resolve schema cache issues
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <p className="text-sm text-muted-foreground mb-4">
          This migration ensures that the seasons table exists and that the matches table has a proper foreign key
          relationship to it. It will fix the "Could not find a relationship between 'matches' and 'seasons'" error.
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
