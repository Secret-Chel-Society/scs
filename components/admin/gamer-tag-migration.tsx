"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check } from "lucide-react"

export function GamerTagMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(false)

      const response = await fetch("/api/admin/run-migration/add-gamer-tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setSuccess(true)
    } catch (err: any) {
      console.error("Error running migration:", err)
      setError(err.message || "An error occurred while running the migration")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Gamer Tag to Users</CardTitle>
        <CardDescription>
          This migration adds a gamer_tag column to the users table if it doesn't already exist.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4 bg-green-50 dark:bg-green-900/20">
            <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-600 dark:text-green-400">Success</AlertTitle>
            <AlertDescription>Migration completed successfully.</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading}>
          {isLoading ? "Running Migration..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
