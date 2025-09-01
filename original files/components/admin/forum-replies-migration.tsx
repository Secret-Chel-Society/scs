"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Check, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ForumRepliesMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/admin/run-migration/forum-replies-table", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to run migration")
      }

      setIsComplete(true)
    } catch (err) {
      console.error("Migration error:", err)
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Forum Replies Migration</CardTitle>
        <CardDescription>
          This migration will create the necessary tables and functions for the forum reply system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">This migration will:</h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Create the forum_replies table</li>
              <li>Add reply_count column to forum_posts</li>
              <li>Create function to increment reply counts</li>
              <li>Update forum_votes table to support replies</li>
              <li>Add necessary indexes for performance</li>
            </ul>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isComplete && (
            <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-400">Success</AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                Migration completed successfully. The forum reply system is now ready to use.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading || isComplete}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Migration...
            </>
          ) : isComplete ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Migration Complete
            </>
          ) : (
            "Run Migration"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
