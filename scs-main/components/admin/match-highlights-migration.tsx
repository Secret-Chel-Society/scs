"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function MatchHighlightsMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsLoading(true)
      setErrorMessage(null)

      const response = await fetch("/api/admin/run-migration/match-highlights", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setIsComplete(true)
      toast({
        title: "Migration Successful",
        description: "The match highlights table has been created successfully.",
      })
    } catch (error: any) {
      console.error("Migration error:", error)
      setErrorMessage(error.message || "An error occurred while running the migration.")
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
        <CardTitle>Match Highlights Table</CardTitle>
        <CardDescription>Create the match_highlights table to store video highlights for matches</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration will create a new table to store video highlights for matches. This allows team managers to add
          YouTube video highlights to their match pages.
        </p>

        {errorMessage && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Migration Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" disabled={isLoading || isComplete}>
          Cancel
        </Button>
        <Button onClick={runMigration} disabled={isLoading || isComplete}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isComplete ? "Migration Complete" : isLoading ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
