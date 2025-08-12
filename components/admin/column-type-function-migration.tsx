"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function ColumnTypeFunctionMigration() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const runMigration = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      // Get the session token
      const token = localStorage.getItem("supabase.auth.token")

      const response = await fetch("/api/admin/run-migration/column-type-function", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to run migration")
      }

      setResult({
        success: true,
        message: data.message || "Migration completed successfully",
      })
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "An error occurred while running the migration",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Column Type Function</CardTitle>
        <CardDescription>
          Creates a database function to check column data types, which helps with type conversion in the application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">
          This migration creates a PostgreSQL function that allows the application to check the data type of any column
          in the database. This is useful for handling type conversions correctly, especially when dealing with IDs that
          might be integers or UUIDs.
        </p>

        {result && (
          <Alert variant={result.success ? "default" : "destructive"} className="mt-4">
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            <AlertTitle>{result.success ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={runMigration} disabled={isLoading}>
          {isLoading ? "Running..." : "Run Migration"}
        </Button>
      </CardFooter>
    </Card>
  )
}
