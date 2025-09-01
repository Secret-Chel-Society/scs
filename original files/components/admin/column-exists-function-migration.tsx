"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"

export function ColumnExistsFunctionMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const { toast } = useToast()

  const runMigration = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/admin/run-migration/column-exists-function", {
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
        description: "The column_exists function has been created successfully.",
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
        <CardTitle>Column Exists Function Migration</CardTitle>
        <CardDescription>
          Creates a database function to check if a column exists in a table. This is used by the standings calculator
          to handle missing columns gracefully.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration creates a PostgreSQL function called <code>column_exists</code> that takes a table name and
          column name as parameters and returns a boolean indicating whether the column exists in the table.
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
