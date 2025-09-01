"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function TableExistsFunctionMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/admin/run-migration/table-exists-function", {
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
        description: "The table_exists function has been created successfully.",
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
        <CardTitle>Table Exists Function Migration</CardTitle>
        <CardDescription>
          Creates a database function to check if a table exists. This is used by various components to handle missing
          tables gracefully.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration creates a PostgreSQL function called <code>table_exists</code> that takes a table name as a
          parameter and returns a boolean indicating whether the table exists in the database.
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
