"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { toast } from "@/components/ui/use-toast"

export function TableInfoFunctionsMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const runMigration = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/admin/run-migration/table-info-functions", {
        method: "POST",
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to run migration")
      }

      toast({
        title: "Migration successful",
        description: "Database information functions have been created.",
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
        <CardTitle>Database Information Functions Migration</CardTitle>
        <CardDescription>Create functions to explore database structure</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4">
          This migration will create SQL functions that allow you to explore the database structure, including tables
          and their columns.
        </p>
        <Button onClick={runMigration} disabled={isLoading || isComplete}>
          {isLoading ? "Running Migration..." : isComplete ? "Migration Complete" : "Run Migration"}
        </Button>
      </CardContent>
    </Card>
  )
}
